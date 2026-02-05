#include <stdio.h>
#include <stdlib.h>

int main(void) 
{

    int h;

    printf("Please input the Height of your Pyramid: ");
    scanf("%d", &h);


    //int j = 0;
    for(int i=0; i <= h; i++)
    {

        // if (i > j+1)
        // {
        //     printf("\n");
        //     j++;
        //     i=0;
        // }else
        // {
        //     printf("#");
        // }

        for(int j=0; i > j; j++)
        {
            printf("#");
        }

        printf("\n");
 
    }

    system("pause");

    return 0;
}